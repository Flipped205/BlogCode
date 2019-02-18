---
title: KMP算法代码案例
categories:
tags:
- 算法
other: code_01 
date: 2018-05-14 
---

```c
#include <stdio.h>
#include <string.h>
#include <stdlib.h>


int *computer_prefix(char *str_p,int *tt){

    if(NULL == str_p)
        return NULL;
    int i=0,j=0;
    int m = strlen(str_p);

    tt[0]=0;
    for(i=1;i<m;i++){
        while(j>0 && str_p[j]!=str_p[i])
            j=tt[j];

        if(str_p[j]==str_p[i])
            j=j+1;
        tt[i]=j;
    }
    return tt;
}

int kmp_matcher(char *str_t,char *str_p){
    if(NULL ==str_t || NULL == str_p)
        return -1;

    int flag = -1;
    int n = strlen(str_t);
    int m = strlen(str_p);
    int i=0,j=0;
    int *tt = (int*)malloc(sizeof(int)*m);
    computer_prefix(str_p,tt);

    if(NULL == tt)
        return -1;

    //printf tt
    for(i=0;i<m;i++){
        printf("tt[%d]=%d ",i,tt[i]);
    }
    printf("\n");
    
    for(i=0;i<n;i++){
        while(j>0 && str_t[i] != str_p[j])
            j = tt[j-1];
        
        if(str_t[i] == str_p[j])
            j++;
        if(j == m){
            flag++;
            printf("positon:%d\n",i-j+1);
            j = tt[j-1];
        }
    }
    free(tt);
    tt = NULL;
    return flag;
}


void main(){
    char *str_p="ababaca";
    char *str_t="aababacaafababaca";
    printf("orgin_str:%s\n",str_t);
    printf("find_str:%s\n",str_p);
    int find_num = kmp_matcher(str_t,str_p);
    printf("find %d locations\n",find_num+1);
}

```

参考资料：算法导论